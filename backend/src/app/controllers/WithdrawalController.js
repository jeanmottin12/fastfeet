import * as Yup from 'yup';
import { isWithinInterval, startOfHour, setHours } from 'date-fns';
import Order from '../models/Order';
import Deliveryman from '../models/Deliveryman';

class Withdrawal {
  async update(req, res) {
    const schema = Yup.object().shape({
      deliveryman_id: Yup.number()
        .integer()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({ error: 'Validation fails!' });
    }

    const { orderId } = req.params;
    const { deliveryman_id } = req.body;

    /**
     * Check if Deliveryman exists
     */
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    /**
     * Check if order exists
     */
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(400).json({ error: 'Order not found!' });
    }

    /**
     * Check if order belongs to deliveryman
     */
    if (order.deliveryman_id !== deliveryman_id) {
      return res
        .status(401)
        .json({ error: 'This order was not from this deliveryman ' });
    }

    /**
     * Check if order was not canceled
     */
    if (order.canceled_at !== null) {
      return res
        .status(401)
        .json({ error: `This order was canceled at ${order.canceled_at}` });
    }

    /**
     * Check if the withdraw are in a comercial time
     */
    const currentDate = new Date();

    if (
      !isWithinInterval(currentDate, {
        start: startOfHour(setHours(currentDate, 8)),
        end: startOfHour(setHours(currentDate, 18)),
      })
    ) {
      return res.status(401).json({
        error: 'You can only withdraw the deliveries between 08:00h and 18:00h',
      });
    }

    order.start_date = new Date();

    await order.save();

    return res.json(order);
  }
}

export default new Withdrawal();
