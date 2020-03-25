import * as Yup from 'yup';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import DeliveryProblem from '../models/DeliveryProblem';
import DeliveryMan from '../models/Deliveryman';
import Order from '../models/Order';

import Mail from '../../lib/Mail';

class DeliveryProblemController {
  async index(req, res) {
    const problems = await DeliveryProblem.findAll({
      attributes: ['id', 'delivery_id', 'description'],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'product'],
        },
      ],
    });

    return res.json(problems);
  }

  async show(req, res) {
    const { problemId } = req.params;

    const problem = await DeliveryProblem.findByPk(problemId);

    /**
     * Check if problem exists
     */
    if (!problem) {
      return res.status(400).json({ error: 'Problem not found!' });
    }

    return res.json(problem);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      delivery_id: Yup.number()
        .integer()
        .required(),
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fails!' });
    }

    const { deliverymanId } = req.params;
    const { delivery_id } = req.body;

    /**
     * Check if Deliveryman exists
     */
    const deliverymanExists = await DeliveryMan.findByPk(deliverymanId);

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman not found!' });
    }

    /**
     * Check if Order exists
     */
    const orderExists = await Order.findByPk(delivery_id);

    if (!orderExists) {
      return res.status(400).json({ error: 'Order not found!' });
    }

    /**
     * Check if order belongs to deliveryman
     */
    if (String(orderExists.deliveryman_id) !== deliverymanId) {
      return res
        .status(401)
        .json({ error: 'This order was not from this deliveryman ' });
    }

    const { id, description } = await DeliveryProblem.create(req.body);

    return res.json({
      id,
      delivery_id,
      description,
    });
  }

  async delete(req, res) {
    const { problemId } = req.params;

    const problem = await DeliveryProblem.findByPk(problemId);
    const order = await Order.findByPk(problem.delivery_id, {
      include: [
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
      ],
    });

    /**
     * Check if problem exists
     */
    if (!problem) {
      return res.status(400).json({ error: 'Problem not found!' });
    }

    /**
     * Check if order was not canceled
     */
    if (order.canceled_at !== null) {
      return res
        .status(401)
        .json({ error: `This order was canceled at ${order.canceled_at}` });
    }

    order.canceled_at = new Date();

    await order.save();

    await Mail.sendMail({
      to: `${order.deliveryman.name} <${order.deliveryman.email}>`,
      subject: 'Entrega cancelada',
      template: 'cancellation',
      context: {
        deliveryman: order.deliveryman.name,
        order: order.product,
        date: format(order.canceled_at, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json({ message: 'Order was canceled with success!' });
  }
}

export default new DeliveryProblemController();
